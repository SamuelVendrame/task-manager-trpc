import Link from "next/link";

export default function NotFound() {
  return (
    <div className="alert error">
      Task not found. It may have been deleted. <Link href="/">Back to the list</Link>
    </div>
  );
}
