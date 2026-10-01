/**
 * Converts a Date or ISO string into a human-friendly Greek relative time string.
 */
export function timeAgoGreek(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return 'μόλις τώρα';
  }

  if (diffInSeconds < 60) {
    return `πριν από ${diffInSeconds} δευτερόλεπτα`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) {
    return 'πριν από 1 λεπτό';
  }
  if (diffInMinutes < 60) {
    return `πριν από ${diffInMinutes} λεπτά`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) {
    return 'πριν από 1 ώρα';
  }
  if (diffInHours < 24) {
    return `πριν από ${diffInHours} ώρες`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'χθες';
  }
  if (diffInDays < 7) {
    return `πριν από ${diffInDays} ημέρες`;
  }

  // Format as readable date DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
