import { FynuxLoadingScreen } from "@/components/common/FynuxLoadingScreen";

export default function RootLoading() {
  return (
    <FynuxLoadingScreen
      message="Memuat Fynux OS..."
      submessage="Menghubungkan ke pusat kendali sistem"
    />
  );
}
