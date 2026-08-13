import Layout from '../../components/Layout';
import { RiBarChartGroupedLine, RiFileDownloadLine, RiTimeLine } from 'react-icons/ri';

export default function ReportsPage() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiBarChartGroupedLine className="text-emerald-500" /> Hisobotlar
        </h1>
        <p className="text-gray-500 text-sm mt-1">Excel va PDF formatida natijalarni yuklab oling</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <RiTimeLine className="text-3xl text-emerald-500" />
        </div>
        <p className="text-gray-900 font-semibold mb-1">Hisobot eksporti</p>
        <p className="text-sm text-gray-500">Bu funksiya tez orada qo'shiladi</p>
      </div>
    </Layout>
  );
}
