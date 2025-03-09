import ParamsForm from "./components/ParamsForm";
import History from "./components/History";
import Progress from "./components/Progress";
import { useEffect, useState } from "react";
import { getExperimentRunning, RunningExpResponse } from "./service/service";

function App() {
  const [runningExps, setRunningExps] = useState<RunningExpResponse[]>([]);

  useEffect(() => {
    getExperimentRunning().then((exps) => setRunningExps(exps));
  }, []);

  useEffect(() => {
    const startPolling = setInterval(async () => {
      if (runningExps.length === 0) {
        clearInterval(startPolling);
      } else {
        const exps = await getExperimentRunning();
        setRunningExps(exps);
      }
    }, 1000);

    return () => clearInterval(startPolling);
  }, [runningExps]);

  return (
    <div className="App container max-w-screen-lg mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Experiment Management System
      </h1>
      <ParamsForm
        callbackOnRun={(exp_id, status, params) => {
          const queuedExp: RunningExpResponse = {
            id: exp_id,
            params,
            status,
            current_epoch: 0,
            total_epochs: params.epochs,
          };
          setRunningExps((prev) => [...prev, queuedExp]);
        }}
      />
      <div className="mt-4">
        <div className="flex flex-col items-center w-full">
          <div className="py-4 w-4/5">
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              Training Progress
            </h2>
            <Progress experiments={runningExps} />
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <div className="py-4 w-4/5">
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              Training History
            </h2>
            <History newEvent={runningExps} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
