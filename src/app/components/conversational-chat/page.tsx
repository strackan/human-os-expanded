import ConversationalChat from "../../../../components/chat/ConversationalChat";
import { renewalsChatWorkflow } from "../../../../components/chat/chatWorkflow";
import Link from "next/link";

export default function ConversationalChatPage() {
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
            <li className="text-gray-700 font-medium">ConversationalChat</li>
          </ol>
        </nav>
        
        <h1 className="text-3xl font-bold mb-6">Conversational Chat - Independent Testing</h1>
        <p className="text-gray-600 mb-8">Work on the conversational chat component in isolation</p>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 h-[600px]">
          <ConversationalChat
            steps={renewalsChatWorkflow.steps}
            step={0}
            answers={[]}
            waiting={false}
            onSubmit={(answer) => console.log('Submitted:', answer)}
            onInputChange={() => {}}
            input=""
            onMultiStepAdvance={(nextStep, updatedAnswers) => {
              console.log('Multi-step advance:', nextStep, updatedAnswers);
            }}
          />
        </div>
      </div>
    </div>
  );
} 