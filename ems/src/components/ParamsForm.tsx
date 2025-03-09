import React, { useState } from "react";
import Button from "./Button";
import { startExperiment } from "../service/service";

const ParamsForm: React.FC<{
  callbackOnRun?: () => void;
}> = ({ callbackOnRun }) => {
  const [hyperparameter, setHyperparameter] = useState({
    learning_rate: 0.01,
    batch_size: 64,
    epochs: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHyperparameter((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  const triggerExperiment = async () => {
    try {
      await startExperiment(hyperparameter);
      if (callbackOnRun) {
        callbackOnRun();
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center my-8 space-y-4 md:space-y-0 md:space-x-4">
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700">
          Learning Rate
          <input
            name="learning_rate"
            type="number"
            step="0.005"
            min="0.005"
            value={hyperparameter.learning_rate}
            onChange={handleChange}
            className="block mt-3 text-gray-900 border rounded px-2 py-1"
          />
        </label>
      </div>
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700">
          Epoch
          <span className="block mt-1 text-gray-900">
            {hyperparameter.epochs}
            <input
              name="epochs"
              type="range"
              min="1"
              max="100"
              value={hyperparameter.epochs}
              onChange={handleChange}
              className="block mt-1 text-gray-900"
            />
          </span>
        </label>
      </div>
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700">
          Batch Size
          <span className="block mt-1 text-gray-900">
            {hyperparameter.batch_size}
            <input
              name="batch_size"
              type="range"
              min="1"
              max="1024"
              value={hyperparameter.batch_size}
              onChange={handleChange}
              className="block mt-1 text-gray-900"
            />
          </span>
        </label>
      </div>
      <div className="flex">
        <Button
          onClick={triggerExperiment}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold text-lg w-22 h-10"
        >
          Run
        </Button>
      </div>
    </div>
  );
};

export default ParamsForm;
