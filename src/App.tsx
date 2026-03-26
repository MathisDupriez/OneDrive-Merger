import { Layout } from "./components/Layout";
import { StepSelect } from "./components/StepSelect";
import { StepScan } from "./components/StepScan";
import { StepReview } from "./components/StepReview";
import { StepMerge } from "./components/StepMerge";
import { useMergeStore } from "./stores/mergeStore";

function App() {
  const currentStep = useMergeStore((s) => s.currentStep);

  return (
    <Layout>
      {currentStep === 1 && <StepSelect />}
      {currentStep === 2 && <StepScan />}
      {currentStep === 3 && <StepReview />}
      {currentStep === 4 && <StepMerge />}
    </Layout>
  );
}

export default App;
