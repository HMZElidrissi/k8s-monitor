import { IconError404 } from '@tabler/icons-react';

export default function NotFound() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <IconError404 size={128} className='text-primary' />
        <h1 className='text-4xl leading-tight font-bold flex items-center gap-2'>
          Page Not Found
        </h1>
        <p className='text-muted-foreground text-center'>
          Sorry, the page you are looking for doesn't exist. <br />
          It might have been moved or deleted.
        </p>
      </div>
    </div>
  );
}
