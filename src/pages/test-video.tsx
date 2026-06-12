import PlaceImageSlider from '@/components/places/place-image-slider';
import VideoPreview from '@/components/places/video-preview';
import Layout from '@/layouts/_layout';

const testImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
];
const testVideos = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

export default function TestVideoPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Тест видео и фото</h1>
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2">PlaceImageSlider (детальная карточка)</h2>
        <div className="max-w-xl">
          <PlaceImageSlider images={testImages} videos={testVideos} title="Тестовый плейс" />
        </div>
      </div>
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2">VideoPreview (карточка в списке)</h2>
        <div className="w-64 h-96">
          <VideoPreview src={testVideos[0]} alt="Тестовое видео" />
        </div>
      </div>
    </div>
  );
}

TestVideoPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
}; 