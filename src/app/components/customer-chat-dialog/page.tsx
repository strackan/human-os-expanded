"use client";
import CustomerChatDialog, { ChatMessage } from "../../../components/customers/CustomerChatDialog";
import { useState } from "react";
import Link from "next/link";

export default function CustomerChatDialogPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I can help you with this customer renewal.' }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/components" className="hover:text-blue-600 transition-colors">
                Components
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li className="text-gray-700 font-medium">CustomerChatDialog</li>
          </ol>
        </nav>
        
        <h1 className="text-3xl font-bold mb-6">Customer Chat Dialog - Independent Testing</h1>
        <p className="text-gray-600 mb-8">Work on the chat dialog component in isolation</p>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 h-[600px]">
          <CustomerChatDialog
            messages={messages}
            setMessages={setMessages}
            recommendedAction={{
              label: "Prepare for Renewal",
              icon: "HandRaisedIcon"
            }}
            onPrepare={() => console.log('Prepare clicked')}
            botIntroMessage="Please review the information and feel free to ask questions about this account."
            inputPlaceholder="Type your question..."
          />
        </div>
      </div>
    </div>
  );
} 