import React from "react";
import ProcessingIndicator from "../components/ProcessingIndicator";
import ImplementationNotice from "../components/ImplementationNotice";
import { UserGroupIcon, ClockIcon, LightBulbIcon } from "@heroicons/react/24/solid";

interface MeetingDetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const MeetingDetailItem: React.FC<MeetingDetailItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start py-2">
    <Icon className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
    <div>
      <span className="text-sm font-medium text-gray-700 block">{label}:</span>
      <span className="text-sm text-gray-600">{value}</span>
    </div>
  </div>
);

const MeetingWorkflow = () => {
  return (
    <div className="p-2">
      <ProcessingIndicator
        title="AI Meeting Scheduler Active"
        message="Analyzing calendars, stakeholder availability, and renewal timeline..."
        progress={75}
      />

      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="text-md font-semibold text-gray-700 mb-3">Meeting Recommendation:</h5>
        <div className="space-y-2 divide-y divide-gray-200">
          <MeetingDetailItem 
            icon={ClockIcon} 
            label="Optimal Timing"
            value="Schedule 30-45 days before renewal date ([Target Date Range])"
          />
          <MeetingDetailItem 
            icon={UserGroupIcon} 
            label="Suggested Attendees"
            value="[Your Name], [Customer Primary Contact], [Customer Exec Sponsor (Optional)]"
          />
          <MeetingDetailItem 
            icon={LightBulbIcon} 
            label="Key Meeting Focus"
            value="Review value, discuss new features, align on renewal path, address concerns."
          />
        </div>
      </div>

      <ImplementationNotice />
    </div>
  );
};

export default MeetingWorkflow; 