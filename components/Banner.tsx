"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import {
  Search,
  PlayCircle,
  UsersRound,
  GraduationCap,
  Layers3,
  Star,
  Monitor,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statistics = [
  {
    icon: UsersRound,
    value: "50,000+",
    label: "Registered Students",
  },
  {
    icon: GraduationCap,
    value: "2,500+",
    label: "Verified Tutors",
  },
  {
    icon: Layers3,
    value: "500+",
    label: "Active Tuitions",
  },
  {
    icon: Star,
    value: "4.8/5",
    label: "Average Rating",
  },
]

export default function Banner() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [classLevel, setClassLevel] = useState("")
  const [mode, setMode] = useState("both")

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const params = new URLSearchParams()

    if (search.trim()) {
      params.set("search", search.trim())
    }

    if (classLevel) {
      params.set("class", classLevel)
    }

    params.set("mode", mode)

    router.push(`/tuitions?${params.toString()}`)
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#080D0F] text-white">
      {/* Background Decoration */}

      <div className="pointer-events-none absolute -top-40 right-0 h-[450px] w-[450px] rounded-full bg-[#B6F70B]/10 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#B6F70B]/5 blur-[100px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 pt-8 pb-7 sm:px-10 lg:px-14">
        {/* =================================
            HERO SECTION
        ================================= */}

        <div className="grid items-center gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left Content */}

          <div className="relative z-10">
            {/* Badge */}

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B6F70B]/40 bg-[#B6F70B]/5 px-3 py-1.5 text-xs font-medium text-gray-200">
              <Search className="h-3.5 w-3.5 text-[#B6F70B]" />
              Smart Tuition & Mentorship Platform
            </div>

            {/* Heading */}

            <h1 className="max-w-[570px] text-3xl leading-[1.18] font-extrabold tracking-tight sm:text-4xl lg:text-[38px]">
              Find Your Ideal Tutor or{" "}
              <span className="text-[#B6F70B]">Mentorship Batch</span> Today
            </h1>

            {/* Description */}

            <p className="mt-4 max-w-[510px] text-sm leading-[1.65] text-gray-300 sm:text-[13px]">
              Discover verified tutors, quality tuitions and mentorship batches
              for your academic and career goals – online or offline.
            </p>

            {/* Action Buttons */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => router.push("/tuitions")}
                className="h-10 gap-2 rounded-full bg-[#B6F70B] px-5 text-xs font-bold text-black hover:bg-[#C9FF42]"
              >
                Browse Tuitions
                <span>→</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/how-it-works")}
                className="h-10 gap-2 rounded-full border border-[#B6F70B]/70 bg-transparent px-5 text-xs font-semibold text-white hover:bg-[#B6F70B]/10 hover:text-[#B6F70B]"
              >
                <PlayCircle className="h-4 w-4 text-[#B6F70B]" />
                How It Works
              </Button>
            </div>
          </div>

          {/* Right Illustration */}

          <div className="relative mx-auto h-[260px] w-full max-w-[590px] sm:h-[320px] lg:h-[245px]">
            {/* Green Shape */}

            <div className="absolute top-5 right-[15%] h-[190px] w-[65%] -skew-x-12 rounded-[45px] bg-gradient-to-br from-[#B6F70B] to-[#527D00] opacity-90 sm:h-[240px]" />

            <div className="absolute right-[10%] bottom-0 h-24 w-[75%] rounded-full bg-[#B6F70B]/20 blur-3xl" />

            {/* Students Image */}

            <Image
              src="/banner.png"
              alt="Tuitora students and mentors"
              width={800}
              height={560}
              priority
              className="absolute inset-0 z-10 h-full w-full object-contain object-bottom"
            />

            {/* Verified Tutors Badge */}

            <div className="absolute top-[45%] left-0 z-20 flex items-center gap-2 rounded-2xl border border-white/5 bg-[#142025]/95 px-3 py-2 shadow-xl sm:left-2">
              <GraduationCap className="h-6 w-6 shrink-0 text-[#B6F70B]" />

              <div>
                <p className="text-sm font-extrabold">2,500+</p>

                <p className="text-[10px] text-gray-300">Verified Tutors</p>
              </div>
            </div>

            {/* Students Badge */}

            <div className="absolute top-[45%] right-0 z-20 flex items-center gap-2 rounded-2xl border border-white/5 bg-[#142025]/95 px-3 py-2 shadow-xl sm:right-2">
              <GraduationCap className="h-6 w-6 shrink-0 text-[#B6F70B]" />

              <div>
                <p className="text-sm font-extrabold">50,000+</p>

                <p className="text-[10px] text-gray-300">Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================
            SEARCH SECTION
        ================================= */}

        <form onSubmit={handleSearch} className="mt-2">
          <Card className="overflow-visible rounded-[22px] border border-[#26343A] bg-[#141E23] py-0 shadow-none">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 items-center gap-1 md:grid-cols-[minmax(0,1.35fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)_auto]">
                {/* Search Input */}

                <div className="flex min-w-0 items-center gap-3 px-4">
                  <Search className="h-5 w-5 shrink-0 text-[#B6F70B]" />

                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tuition title or subject..."
                    aria-label="Search tuition title or subject"
                    className="h-12 min-w-0 border-0 bg-transparent px-0 text-sm text-white shadow-none placeholder:text-gray-400 focus-visible:ring-0"
                  />
                </div>

                <Separator
                  orientation="vertical"
                  className="hidden h-7 bg-[#334047] md:block"
                />

                {/* Class Level Select */}

                <div className="flex min-w-0 items-center gap-2 px-4">
                  <GraduationCap className="h-5 w-5 shrink-0 text-[#B6F70B]" />

                  <Select value={classLevel} onValueChange={setClassLevel}>
                    <SelectTrigger
                      aria-label="Select class level"
                      className="h-12 w-full min-w-0 border-0 bg-transparent text-sm text-gray-300 shadow-none focus:ring-0 focus-visible:ring-0"
                    >
                      <SelectValue placeholder="Select Class Level" />
                    </SelectTrigger>

                    <SelectContent className="border-[#29383D] bg-[#142025] text-white">
                      <SelectItem value="class-6">Class 6</SelectItem>
                      <SelectItem value="class-7">Class 7</SelectItem>
                      <SelectItem value="class-8">Class 8</SelectItem>
                      <SelectItem value="class-9">Class 9</SelectItem>
                      <SelectItem value="class-10">Class 10</SelectItem>
                      <SelectItem value="ssc">SSC</SelectItem>
                      <SelectItem value="hsc">HSC</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator
                  orientation="vertical"
                  className="hidden h-7 bg-[#334047] md:block"
                />

                {/* Online / Offline Select */}

                <div className="flex min-w-0 items-center gap-2 px-4">
                  <Monitor className="h-5 w-5 shrink-0 text-[#B6F70B]" />

                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger
                      aria-label="Select tuition mode"
                      className="h-12 w-full min-w-0 border-0 bg-transparent text-sm text-gray-300 shadow-none focus:ring-0 focus-visible:ring-0"
                    >
                      <SelectValue placeholder="Online / Offline" />
                    </SelectTrigger>

                    <SelectContent className="border-[#29383D] bg-[#142025] text-white">
                      <SelectItem value="both">Online / Offline</SelectItem>

                      <SelectItem value="online">Online</SelectItem>

                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}

                <Button
                  type="submit"
                  className="h-11 w-full gap-2 rounded-full bg-[#B6F70B] px-6 text-sm font-bold text-black hover:bg-[#C9FF42] md:w-auto"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* =================================
            STATISTICS SECTION
        ================================= */}

        <Card className="mt-3 rounded-[22px] border border-[#1F2C31] bg-[#111B20] py-0 shadow-none">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {statistics.map((stat, index) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    className={`flex min-h-[68px] items-center justify-center gap-3 px-3 py-3 sm:px-6 ${
                      index % 2 === 0 ? "border-r border-[#334047]" : ""
                    } ${
                      index < 2 ? "border-b border-[#334047] lg:border-b-0" : ""
                    } ${
                      index < 3
                        ? "lg:border-r lg:border-[#334047]"
                        : "lg:border-r-0"
                    }`}
                  >
                    <Icon className="h-7 w-7 shrink-0 text-[#B6F70B] drop-shadow-[0_0_8px_rgba(182,247,11,0.35)] sm:h-8 sm:w-8" />

                    <div className="min-w-0">
                      <p className="text-base font-extrabold text-white sm:text-lg">
                        {stat.value}
                      </p>

                      <p className="text-[10px] text-gray-300 sm:text-[11px]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
