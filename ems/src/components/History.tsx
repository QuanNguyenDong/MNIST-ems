import React, { useEffect, useState } from "react";
import { getExperimentsHistory } from "../service/service";

interface HistoryProps {
  newEvent: any;
}

const History: React.FC<HistoryProps> = ({ newEvent }) => {
  const [experiments, setExperiments] = useState<any[]>([]);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const experiments = await getExperimentsHistory();
        setExperiments(experiments);
      } catch (error) {
        console.error(error);
      }
    };
    fetchExperiments();
  }, [newEvent]);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left rtl:text-right">
        <thead className="text-s text-gray-700 uppercase bg-blue-300">
          <tr>
            <th scope="col" className="px-6 py-3">
              Experiment ID
            </th>
            <th scope="col" className="px-6 py-3">
              LR
            </th>
            <th scope="col" className="px-6 py-3">
              Epochs
            </th>
            <th scope="col" className="px-6 py-3">
              BS
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Final Acc
            </th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => {
            const { epochs, learning_rate, batch_size } = exp.params;
            return (
              <tr key={exp.id} className="bg-white border-b border-gray-200">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  {exp.id}
                </th>
                <td className="px-6 py-4">{learning_rate}</td>
                <td className="px-6 py-4">{epochs}</td>
                <td className="px-6 py-4">{batch_size}</td>
                <td className="px-6 py-4">{exp.status}</td>
                <td className="px-6 py-4">{exp.final_accuracy}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default History;
