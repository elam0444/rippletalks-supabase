import Link from "next/link";
import Image from "next/image";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className='border-b'>
        <div className='mx-auto px-4 h-16 flex items-center'>
          <Link href='/' className='flex items-center gap-2'>
            <Image
              src='/RippleTalks Logo_edited.png'
              alt='RippleTalk Logo'
              width={40}
              height={40}
            />
            <span className='font-semibold text-lg'>Ripple Talks</span>
          </Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
