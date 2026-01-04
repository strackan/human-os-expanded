'use client';

interface BestFitRolesCardProps {
  roles: string[];
}

export function BestFitRolesCard({ roles }: BestFitRolesCardProps) {
  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 text-white">Best Fit Roles</h2>
      <p className="text-gray-300 mb-6">
        Based on your profile, these roles align with your strengths and interests:
      </p>
      <div className="flex flex-wrap gap-3">
        {roles.map((role, idx) => (
          <span
            key={idx}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
