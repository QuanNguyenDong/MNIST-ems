import React from "react";
import { RunningExpResponse } from "../service/service";

interface ProgressProps {
  experiments: RunningExpResponse[];
}

const Progress: React.FC<ProgressProps> = ({ experiments }) => {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left rtl:text-right">
        <thead className="text-s text-gray-700 uppercase bg-blue-300">
          <tr>
            <th scope="col" className="px-6 py-3 whitespace-nowrap">
              Experiment ID
            </th>
            <th scope="col" className="px-6 py-3">
              LR
            </th>
            <th scope="col" className="px-6 py-3">
              BS
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Epochs
            </th>
            <th scope="col" className="px-6 py-3">
              Accuracy
            </th>
            <th scope="col" className="px-6 py-3">
              Loss
            </th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => {
            const { learning_rate, batch_size } = exp.params;
            return (
              <tr key={exp.id} className="bg-white border-b border-gray-200">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  {exp.id}
                </th>
                <td className="px-6 py-4">{learning_rate}</td>
                <td className="px-6 py-4">{batch_size}</td>
                <td className="px-6 py-4">{exp.status}</td>
                <td className="px-6 py-4">
                  {exp.current_epoch}/{exp.total_epochs}
                </td>
                <td className="px-6 py-4">{exp.current_accuracy}</td>
                <td className="px-6 py-4">{exp.current_loss}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Progress;
