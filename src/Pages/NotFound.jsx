import image from '../assets/NotFound.png'

export default function NotFound() {
  return (
    <div className="flex w-full !overflow-hidden items-center justify-center max-h-screen">
        <div className="">
        <img
        src={image}
        alt="Not Found"
        className="w-[70%] h-fit  !m-auto max-w-2/3  "
      />
        </div>

    </div>
  );
}
