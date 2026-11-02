import { FynuxLoadingScreen } from "@/components/common/FynuxLoadingScreen";

export default function DashboardLoading() {
  return (
    <FynuxLoadingScreen
      message="Memuat Ruang Kerja..."
      submessage="Menyiapkan data operasional Fynux OS"
    />
  );
}
