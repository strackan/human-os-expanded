/**
 * Tenant Provisioner
 *
 * Core logic for provisioning test drives and pilots.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface DemoTemplate {
  id: string;
  display_name: string;
  description: string | null;
  industry: string;
  customer_data: Record<string, unknown>;
  contacts_data: Array<Record<string, unknown>>;
  contracts_data: Record<string, unknown>;
  renewals_data: Record<string, unknown>;
  operations_data: Array<Record<string, unknown>> | null;
  tickets_data: Array<Record<string, unknown>> | null;
  workflow_template_id: string | null;
}

export interface ProvisionConfig {
  template: string;
  seEmail: string;
  prospectCompany?: string;
  prospectEmail?: string;
  durationDays: number;
  environment: 'demo' | 'staging';
  tenantType: 'test_drive' | 'pilot';
  notes?: string;
}

export interface ProvisionResult {
  success: boolean;
  companyId: string;
  pilotTenantId: string;
  customerId: string;
  accessUrl: string;
  expiresAt: Date;
  template: DemoTemplate;
}

export class TenantProvisioner {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Load a demo template by ID
   */
  async loadTemplate(templateId: string): Promise<DemoTemplate> {
    const { data, error } = await this.supabase
      .from('demo_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error(`Template '${templateId}' not found or inactive`);
    }

    return data as DemoTemplate;
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<DemoTemplate[]> {
    const { data, error } = await this.supabase
      .from('demo_templates')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }

    return (data || []) as DemoTemplate[];
  }

  /**
   * Provision a new tenant
   */
  async provision(config: ProvisionConfig): Promise<ProvisionResult> {
    // 1. Load template
    const template = await this.loadTemplate(config.template);
    console.log(`Loaded template: ${template.display_name}`);

    // 2. Generate unique company name
    const timestamp = Date.now().toString(36).toUpperCase();
    const companyName = config.prospectCompany
      ? `${config.prospectCompany} [${config.tenantType === 'test_drive' ? 'TD' : 'PILOT'}-${timestamp}]`
      : `${template.display_name} [${config.tenantType === 'test_drive' ? 'TD' : 'PILOT'}-${timestamp}]`;

    // 3. Create company
    const { data: company, error: companyError } = await this.supabase
      .from('companies')
      .insert({
        name: companyName,
        domain: this.generateDomain(config.prospectCompany || template.display_name),
        tenant_type: config.tenantType,
        is_demo_tenant: true,
      })
      .select()
      .single();

    if (companyError || !company) {
      throw new Error(`Failed to create company: ${companyError?.message}`);
    }
    console.log(`Created company: ${company.name} (${company.id})`);

    // 4. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.durationDays);

    // 5. Create pilot_tenants record
    const { data: pilot, error: pilotError } = await this.supabase
      .from('pilot_tenants')
      .insert({
        company_id: company.id,
        tenant_type: config.tenantType,
        template_id: config.template,
        environment: config.environment,
        expires_at: expiresAt.toISOString(),
        se_email: config.seEmail,
        prospect_company: config.prospectCompany,
        prospect_email: config.prospectEmail,
        notes: config.notes,
        status: 'active',
      })
      .select()
      .single();

    if (pilotError || !pilot) {
      // Rollback company
      await this.supabase.from('companies').delete().eq('id', company.id);
      throw new Error(`Failed to create pilot tenant: ${pilotError?.message}`);
    }
    console.log(`Created pilot tenant: ${pilot.id}`);

    // 6. Seed customer data
    const customerId = await this.seedTenantData(company.id, template);
    console.log(`Seeded customer data: ${customerId}`);

    // 7. Generate access URL
    const baseUrl =
      config.environment === 'demo'
        ? 'https://demo.renubu.com'
        : 'https://staging.renubu.com';
    const accessUrl = `${baseUrl}/dashboard?company=${company.id}`;

    return {
      success: true,
      companyId: company.id,
      pilotTenantId: pilot.id,
      customerId,
      accessUrl,
      expiresAt,
      template,
    };
  }

  /**
   * Seed demo data for a tenant from template
   */
  private async seedTenantData(
    companyId: string,
    template: DemoTemplate
  ): Promise<string> {
    // Create customer - cast to allow dynamic properties
    const customerData: Record<string, unknown> = {
      ...template.customer_data,
      company_id: companyId,
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove any 'name' uniqueness issues by adding company suffix
    if (customerData.name && typeof customerData.name === 'string') {
      customerData.name = `${customerData.name} (${companyId.slice(0, 8)})`;
    }

    const { data: customer, error: customerError } = await this.supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (customerError || !customer) {
      throw new Error(`Failed to create customer: ${customerError?.message}`);
    }

    // Create contacts
    for (const contactData of template.contacts_data) {
      const { error: contactError } = await this.supabase.from('contacts').insert({
        ...contactData,
        customer_id: customer.id,
        is_demo: true,
      });

      if (contactError) {
        console.warn(`Warning: Failed to create contact: ${contactError.message}`);
      }
    }

    // Create contract
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 6);

    const contractData = {
      ...template.contracts_data,
      customer_id: customer.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_demo: true,
    };

    const { error: contractError } = await this.supabase
      .from('contracts')
      .insert(contractData);

    if (contractError) {
      console.warn(`Warning: Failed to create contract: ${contractError.message}`);
    }

    // Create renewal
    const renewalDate = new Date(now);
    renewalDate.setMonth(renewalDate.getMonth() + 2);

    const renewalData = {
      ...template.renewals_data,
      customer_id: customer.id,
      renewal_date: renewalDate.toISOString().split('T')[0],
      is_demo: true,
    };

    const { error: renewalError } = await this.supabase
      .from('renewals')
      .insert(renewalData);

    if (renewalError) {
      console.warn(`Warning: Failed to create renewal: ${renewalError.message}`);
    }

    // Create demo operations (if present)
    if (template.operations_data && template.operations_data.length > 0) {
      for (const opData of template.operations_data) {
        await this.supabase.from('demo_operations').insert({
          ...opData,
          customer_id: customer.id,
        });
      }
    }

    // Create demo tickets (if present)
    if (template.tickets_data && template.tickets_data.length > 0) {
      for (let i = 0; i < template.tickets_data.length; i++) {
        const ticketData = template.tickets_data[i];
        await this.supabase.from('demo_support_tickets').insert({
          ...ticketData,
          customer_id: customer.id,
          ticket_number: `TKT-${companyId.slice(0, 4).toUpperCase()}-${i + 1}`,
        });
      }
    }

    return customer.id;
  }

  /**
   * Generate a domain from company name
   */
  private generateDomain(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .concat('.demo');
  }
}
