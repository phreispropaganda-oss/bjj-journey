import { isViewingAsStudent } from '@/lib/view-mode'
import ViewAsStudentToggle from './ViewAsStudentToggle'

export default async function StudentViewBanner() {
  const active = await isViewingAsStudent()
  if (!active) return null
  return (
    <div className="sticky top-0 z-[60] max-w-[480px] mx-auto">
      <ViewAsStudentToggle active={true} />
    </div>
  )
}
