import { AppShell } from "@/components/shell/AppShell";
import { CreateWizard } from "@/components/create/CreateWizard";

export default function CreatePage() {
  return (
    <AppShell crumbs={["Assignments", "Create Assignment"]}>
      <CreateWizard />
    </AppShell>
  );
}
