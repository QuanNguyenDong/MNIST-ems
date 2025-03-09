import ParamsForm from "./components/ParamsForm";
import History from "./components/History";
import Progress from "./components/Progress";
import { useEffect, useState } from "react";
import { getExperimentRunning, RunningExpResponse } from "./service/service";

function App() {
  const [runningExps, setRunningExps] = useState<RunningExpResponse[]>([]);
  const [event, countEvent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      getExperimentRunning()
        .then((exps) => {
          setRunningExps(exps);
          if (exps.length === 0) {
            countEvent(event + 1);
            clearInterval(interval);
          }
        })
        .catch(console.error);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningExps]);

  return (
    <div className="App container max-w-screen-lg mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Experiment Management System
      </h1>
      <ParamsForm callbackOnRun={() => setRunningExps([...runningExps])} />
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
            <History newEvent={event}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
