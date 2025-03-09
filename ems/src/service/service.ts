import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface ExperimentParams {
  epochs: number;
  learning_rate: number;
  batch_size: number;
}

export interface RunningExpResponse {
  id: number;
  params: ExperimentParams;
  status: string;
  current_epoch: number;
  total_epochs: number;
  current_loss?: number;
  current_accuracy?: number;
}

interface CompletedExpResponse {
  id: number;
  params: ExperimentParams;
  status: string;
  final_accuracy?: number;
  current_epoch: number;
  total_epochs: number;
}

export const startExperiment = async (
  params: ExperimentParams
): Promise<{ experiment_id: number; status: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/experiment`, params);

    if (response.status == 201) {
      throw new Error(response.data["message"])
    }

    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getExperimentRunning =
  async (): Promise<RunningExpResponse[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/experiments/running`);
      return response.data;
    } catch (error) {
      throw new Error();
    }
  };

// Get all finish experiments, sorted by final accuracy (desc).
export const getExperimentsHistory = async (): Promise<
  CompletedExpResponse[]
> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/experiments`);
    return response.data;
  } catch (error) {
    throw new Error();
  }
};
