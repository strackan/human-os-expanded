/**
 * Billing Service
 *
 * Manages Stripe integration for subscriptions and payments.
 */

import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BillingService {
  private stripe: Stripe;
  private supabase?: SupabaseClient;

  constructor(stripeSecretKey: string, supabase?: SupabaseClient) {
    this.stripe = new Stripe(stripeSecretKey);
    this.supabase = supabase;
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(userId: string, email: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });

    if (this.supabase) {
      await this.supabase
        .schema('human_os')
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          status: 'trialing',
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return customer.id;
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    if (this.supabase) {
      await this.supabase
        .schema('human_os')
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscription.id,
          price_id: priceId,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
    }

    return subscription;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    if (this.supabase) {
      await this.supabase
        .schema('human_os')
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);
    }
  }

  /**
   * Get subscription details for a user
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    if (!this.supabase) {
      throw new Error('Supabase client required for getSubscription');
    }

    const { data, error } = await this.supabase
      .schema('human_os')
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      customerId: data.stripe_customer_id,
      subscriptionId: data.stripe_subscription_id,
      priceId: data.price_id,
      status: data.status,
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: string, signature: string, webhookSecret: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionFromStripe(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  }

  private async updateSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .schema('human_os')
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer as string);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .schema('human_os')
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .schema('human_os')
      .from('payment_history')
      .insert({
        customer_id: invoice.customer as string,
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        status: 'succeeded',
        paid_at: invoice.status_transitions.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        created_at: new Date().toISOString(),
      });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .schema('human_os')
      .from('payment_history')
      .insert({
        customer_id: invoice.customer as string,
        invoice_id: invoice.id,
        amount: invoice.amount_due,
        status: 'failed',
        created_at: new Date().toISOString(),
      });

    await this.supabase
      .schema('human_os')
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', invoice.customer as string);
  }
}
