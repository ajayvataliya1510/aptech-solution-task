import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect the root application load into our application space
  redirect('/login');
}
