import React from "react";
import ProcessingIndicator from "../components/ProcessingIndicator";
import ImplementationNotice from "../components/ImplementationNotice";

const EmailWorkflow = () => {
  return (
    <div className="p-2">
      <ProcessingIndicator
        title="AI Email Composer Active"
        message="Analyzing customer data, recent interactions, and renewal goals..."
        progress={45}
      />

      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="text-md font-semibold text-gray-700 mb-3">Generated Email Draft:</h5>
        
        <div className="mb-4">
          <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
          <input 
            type="text" 
            id="email-subject"
            readOnly 
            value="Regarding your upcoming renewal - Exciting updates & Next Steps!"
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
        </div>

        <div>
          <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-1">Body (Preview):</label>
          <textarea 
            id="email-body"
            readOnly 
            rows={6}
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            value={`Hi [Customer Contact Name],\n\nHope you're having a great week!\n\nAs your renewal with CloudForce Systems approaches on [Renewal Date], we wanted to reach out and discuss some exciting new features that we believe will bring even more value to [Customer Company]...\n\n[AI will personalize this section based on their usage and potential interest areas.]\n\nWe'd love to schedule a brief call to walk you through these updates and discuss your renewal strategy...\n\nBest regards,\n[Your Name]`}
          />
        </div>
      </div>

      <ImplementationNotice />
    </div>
  );
};

export default EmailWorkflow; 