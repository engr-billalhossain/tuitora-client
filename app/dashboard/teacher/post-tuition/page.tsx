"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  DollarSign,
  GraduationCap,
  ImagePlus,
  Loader2,
  MapPin,
  PenLine,
  Send,
  Upload,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react"

import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  createTuition,
  getMyTuitions,
} from "@/lib/actions/postTuitions"
import {
  FREE_TUITION_POST_LIMIT,
  isPlanLimitError,
} from "@/lib/plan-limits"
import { isProValue } from "@/lib/plans"
import { useSession } from "@/lib/auth-client"
import { uploadBanner } from "@/lib/actions/uploadImage"
import { TUITION_SLOTS } from "@/lib/slots"

const TITLE_LIMIT = 100
const DESCRIPTION_LIMIT = 500

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Bangla",
  "Computer Science",
  "Accounting",
  "IELTS & Spoken English",
]

const classLevels = [
  "Class 1 – 5",
  "Class 6 – 8",
  "Class 9 – 10",
  "Class 11 – 12 (HSC)",
  "University / Admission",
  "Adult Learners",
]

const daysPerWeek = ["1 Day", "2 Days", "3 Days", "4 Days", "5 Days", "6 Days", "7 Days"]

type Mode = "online" | "offline"

function FieldLabel({
  icon: Icon,
  children,
  required = false,
  iconClassName,
}: {
  icon: LucideIcon
  children: React.ReactNode
  required?: boolean
  iconClassName?: string
}) {
  return (
    <span className="mb-2 flex items-center gap-2">
      <Icon className={cn("h-3.5 w-3.5 text-gray-500", iconClassName)} />
      <span className="text-[12px] font-semibold text-gray-300">
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
    </span>
  )
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#141C21] pr-9 pl-3 text-[12px] outline-none transition-colors",
          "focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10",
          value ? "text-gray-200" : "text-gray-600"
        )}
      >
        <option value="" disabled className="bg-[#141C21] text-gray-500">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#141C21] text-gray-200">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
    </div>
  )
}

export default function PostTuitionPage() {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { data: session, isPending } = useSession()
  const isPro = isProValue(session?.user?.plan)

  const [title, setTitle] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [classLevel, setClassLevel] = React.useState("")
  const [mode, setMode] = React.useState<Mode>("online")
  const [fee, setFee] = React.useState("")
  const [days, setDays] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [bannerName, setBannerName] = React.useState("")
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [slots, setSlots] = React.useState<string[]>(
    () => TUITION_SLOTS.map((slot) => slot.id)
  )
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  // Tutors on the free plan cannot open the post form once they have two
  // tuitions; send them to the pricing page to upgrade instead.
  React.useEffect(() => {
    if (isPending || isPro) return
    let active = true
    getMyTuitions()
      .then((items) => {
        if (active && items.length >= FREE_TUITION_POST_LIMIT) {
          router.replace("/pricing")
        }
      })
      .catch(() => {
        // The API still enforces the limit when submitting the form.
      })
    return () => {
      active = false
    }
  }, [router, isPending, isPro])

  const clearBanner = () => {
    if (fileInputRef.current) fileInputRef.current.value = ""
    setBannerName("")
    setBannerUrl("")
    setUploadError("")
  }

  const handleBannerChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      clearBanner()
      return
    }

    setBannerName(file.name)
    setBannerUrl("")
    setUploadError("")
    setUploading(true)
    try {
      const result = await uploadBanner(file)
      setBannerUrl(result.url)
    } catch (uploadFailure) {
      clearBanner()
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Could not upload the image. Please try again."
      )
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    if (uploading) {
      setError("Please wait for the banner image to finish uploading.")
      setSubmitting(false)
      return
    }

    if (slots.length === 0) {
      setError("Please select at least one available time slot.")
      setSubmitting(false)
      return
    }

    const payload = {
      title,
      subject,
      classLevel,
      mode,
      fee,
      days,
      location,
      bannerName,
      bannerUrl,
      description,
      slots,
    }

    try {
      await createTuition(payload)
      toast.success("Tuition submitted for admin review")
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (submitError) {
      if (isPlanLimitError(submitError)) {
        toast.info(submitError.message)
        router.replace("/pricing")
        return
      }
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the tuition. Please try again."
      )
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the tuition. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#080D0F] text-white sm:-mx-6 sm:-mt-6">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6">
        {/* ---------- HEADER ---------- */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#B6F70B]/50 bg-[#B6F70B]/5">
              <GraduationCap className="h-5 w-5 text-[#B6F70B]" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-white">
                Post a New Tuition
              </h1>
              <p className="mt-1.5 max-w-[640px] text-[11px] leading-relaxed text-gray-500">
                Fill in the details about the subject, class level, mode, and fees.
                Tutors will be reviewed by admin prior to publication.
              </p>
            </div>
          </div>

        </div>

        {submitted && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#B6F70B]/25 bg-[#B6F70B]/5 px-4 py-3 text-[12px] font-semibold text-[#B6F70B]">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Tuition submitted successfully! It will be published after admin review.
            </span>
            <Link
              href="/dashboard/teacher/my-tuitions"
              className="inline-flex items-center gap-1 rounded-lg border border-[#B6F70B]/40 px-3 py-1.5 text-[11px] font-extrabold transition-colors hover:bg-[#B6F70B]/10"
            >
              View My Tuitions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-[12px] font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ---------- FORM CARD ---------- */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0D1417] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.25)] sm:p-6"
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            {/* Tuition Title */}
            <div>
              <FieldLabel icon={BookOpen} required>
                Tuition Title
              </FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={TITLE_LIMIT}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Master HSC Higher Mathematics & Calculus"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#141C21] pr-14 pl-3 text-[12px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-gray-600">
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <FieldLabel icon={Circle} required iconClassName="text-[#B6F70B]">
                Subject
              </FieldLabel>
              <SelectField
                value={subject}
                onChange={setSubject}
                placeholder="Select Subject"
                options={subjects}
              />
            </div>

            {/* Class Level */}
            <div>
              <FieldLabel icon={GraduationCap} required>
                Class Level
              </FieldLabel>
              <SelectField
                value={classLevel}
                onChange={setClassLevel}
                placeholder="Select Class Level"
                options={classLevels}
              />
            </div>

            {/* Tuition Mode */}
            <div>
              <FieldLabel icon={Users} required>
                Tuition Mode
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setMode("online")}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-2 text-[11px] font-semibold transition-colors",
                    mode === "online"
                      ? "border-[#B6F70B]/70 bg-[#B6F70B]/5 text-[#B6F70B]"
                      : "border-white/10 bg-[#141C21] text-gray-400 hover:border-white/20 hover:text-gray-200"
                  )}
                >
                  <Video className="h-3.5 w-3.5 shrink-0" />
                  Online (Zoom / Meet)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("offline")}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-2 text-[11px] font-semibold transition-colors",
                    mode === "offline"
                      ? "border-[#B6F70B]/70 bg-[#B6F70B]/5 text-[#B6F70B]"
                      : "border-white/10 bg-[#141C21] text-gray-400 hover:border-white/20 hover:text-gray-200"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  Offline (In-Person / Home Visit)
                </button>
              </div>
            </div>

            <input type="hidden" name="mode" value={mode} />

            {/* Location */}
            <div>
              <FieldLabel icon={MapPin}>
                Location (city / area, optional)
              </FieldLabel>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={120}
                placeholder="e.g. Dhaka, Banani or Online"
                className="h-10 w-full rounded-lg border border-white/10 bg-[#141C21] px-3 text-[12px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10"
              />
            </div>

            {/* Monthly Fee */}
            <div>
              <FieldLabel icon={DollarSign} required>
                Monthly Fee (USD)
              </FieldLabel>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  min={0}
                  required
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                  placeholder="e.g. 150"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#141C21] pr-3 pl-8 text-[12px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10"
                />
              </div>
            </div>

            {/* Days Per Week */}
            <div>
              <FieldLabel icon={CalendarDays} required>
                Days Per Week
              </FieldLabel>
              <SelectField
                value={days}
                onChange={setDays}
                placeholder="Select Days"
                options={daysPerWeek}
              />
            </div>

            {/* Daily time slots */}
            <div className="md:col-span-2">
              <FieldLabel icon={Clock3} required>
                Available Time Slots (per day)
              </FieldLabel>
              <p className="mb-2 text-[10px] text-gray-500">
                Choose the slots you can teach. The same subject can be posted
                again with different slots. Students can only book a slot you
                select here.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {TUITION_SLOTS.map((slot) => {
                  const checked = slots.includes(slot.id)
                  return (
                    <label
                      key={slot.id}
                      className={cn(
                        "cursor-pointer rounded-lg border p-2.5 transition-colors",
                        checked
                          ? "border-[#B6F70B]/60 bg-[#B6F70B]/[0.07]"
                          : "border-white/10 bg-[#141C21] hover:border-white/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSlots((current) =>
                            current.includes(slot.id)
                              ? current.filter((id) => id !== slot.id)
                              : [...current, slot.id]
                          )
                        }
                        className="h-3 w-3 accent-[#B6F70B]"
                      />
                      <p className="mt-1.5 text-[10px] font-bold text-white">
                        {slot.label}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#B6F70B]">
                        {slot.start} – {slot.end}
                      </p>
                      <p className="mt-0.5 text-[9px] text-gray-500">
                        {slot.duration}
                      </p>
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-[10px] font-semibold text-gray-500">
                {slots.length} of {TUITION_SLOTS.length} slots selected
              </p>
            </div>

            {/* Banner Image */}
            <div className="md:col-span-2">
              <FieldLabel icon={ImagePlus}>Banner Image</FieldLabel>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#10181C] px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#B6F70B]/25 bg-[#B6F70B]/5 bg-cover bg-center"
                    style={
                      bannerUrl
                        ? { backgroundImage: `url(${JSON.stringify(bannerUrl)})` }
                        : undefined
                    }
                  >
                    {!bannerUrl && <ImagePlus className="h-4 w-4 text-[#B6F70B]" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-gray-300">
                      {uploading
                        ? "Uploading image..."
                        : bannerName || "Upload Banner Image (JPG, PNG)"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-600">
                      {bannerUrl
                        ? "Uploaded — this image becomes the tuition card background."
                        : "Recommended size: 1200 x 600 (16:9). Max 32 MB."}
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <div className="flex shrink-0 items-center gap-2">
                  {(bannerName || bannerUrl) && (
                    <button
                      type="button"
                      onClick={clearBanner}
                      aria-label="Remove banner image"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#182127] text-gray-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#182127] px-3 text-[11px] font-semibold text-gray-300 transition-colors hover:border-[#B6F70B]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploading ? "Uploading..." : "Choose File"}
                  </button>
                </div>
              </div>
              {uploadError && (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-rose-300">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {uploadError}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <FieldLabel icon={PenLine} required>
                Tuition Description
              </FieldLabel>
              <div className="relative">
                <textarea
                  required
                  maxLength={DESCRIPTION_LIMIT}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what students will learn, your teaching methodology, prerequisites, and expected outcomes..."
                  className="min-h-[108px] w-full resize-y rounded-lg border border-white/10 bg-[#141C21] p-3 pb-7 text-[12px] leading-relaxed text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10"
                />
                <span className="pointer-events-none absolute right-3 bottom-2.5 text-[10px] text-gray-600">
                  {description.length}/{DESCRIPTION_LIMIT} chars
                </span>
              </div>
            </div>
          </div>

          {/* ---------- ACTIONS ---------- */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/tutor")}
              className="h-10 rounded-lg border border-white/10 bg-[#141C21] px-5 text-[12px] font-semibold text-gray-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#B6F70B] px-5 text-[12px] font-extrabold text-[#0B1100] shadow-[0_4px_18px_rgba(182,247,11,0.2)] transition-colors hover:bg-[#C9FF42] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Submitting..." : uploading ? "Uploading image..." : "Post Tuition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
