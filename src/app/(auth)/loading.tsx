import { FynuxLoadingScreen } from "@/components/common/FynuxLoadingScreen";

export default function AuthLoading() {
  return (
    <FynuxLoadingScreen
      message="Memuat Autentikasi..."
      submessage="Menyiapkan gerbang akses Fynux OS"
    />
  );
}
