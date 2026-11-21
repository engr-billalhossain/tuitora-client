"use client"

import Link from "next/link"

import { GraduationCap, Mail, Phone, MapPin } from "lucide-react"

import {
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// Quick Links

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Browse Tuitions", href: "/tuitions" },
  { name: "Pricing / Pro Plans", href: "/pricing" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
]

// Support Links

const supportLinks = [
  { name: "Help Center", href: "/help" },
  { name: "Contact Us", href: "/contact" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
]

// Social Links

const socialLinks = [
  {
    name: "Facebook",
    icon: FaFacebookF,
    href: "#",
  },
  {
    name: "YouTube",
    icon: FaYoutube,
    href: "#",
  },
  {
    name: "X",
    icon: FaXTwitter,
    href: "#",
  },
  {
    name: "Instagram",
    icon: FaInstagram,
    href: "#",
  },
  {
    name: "LinkedIn",
    icon: FaLinkedinIn,
    href: "#",
  },
]

export default function Footer() {
  return (
    <footer className="w-full bg-[#080D0F] text-white">
      <div className="mx-auto max-w-[1440px] px-6 pt-8 sm:px-8 lg:px-10">
        {/* Top Separator */}

        <Separator className="mb-6 bg-[#273136]" />

        {/* Main Footer */}

        <div className="grid grid-cols-1 gap-9 pb-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Section */}

          <div className="lg:col-span-3">
            <Link
              href="/"
              className="mb-5 flex w-fit items-center gap-2"
              aria-label="MentorLagbe Home"
            >
              <GraduationCap className="h-8 w-8 text-[#B6F70B]" />

              <span className="text-[23px] font-extrabold tracking-tight text-white">
                MentorLagbe
              </span>
            </Link>

            <p className="max-w-[270px] text-[12px] leading-[1.8] text-gray-300">
              A trusted platform to find verified tutors and quality tuitions
              for a better learning journey.
            </p>
          </div>

          {/* Quick Links */}

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-bold text-white">Quick Links</h3>

            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-gray-300 transition-colors duration-200 hover:text-[#B6F70B]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-bold text-white">Support</h3>

            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-gray-300 transition-colors duration-200 hover:text-[#B6F70B]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-bold text-white">Contact</h3>

            <ul className="space-y-3.5">
              {/* Email */}

              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#D9F69A]" />

                <a
                  href="mailto:support@mentorlagbe.com"
                  className="text-[11px] text-gray-300 transition-colors hover:text-[#B6F70B]"
                >
                  support@mentorlagbe.com
                </a>
              </li>

              {/* Phone */}

              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#D9F69A]" />

                <span className="text-[11px] text-gray-300">
                  +880 1846918599
                </span>
              </li>

              {/* Location */}

              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#B6F70B]" />

                <span className="text-[11px] text-gray-300">
                  Dhaka, Bangladesh
                </span>
              </li>
            </ul>
          </div>

          {/* Social Media */}

          <div className="lg:col-span-3">
            <h3 className="mb-4 text-sm font-bold text-white">Follow Us</h3>

            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => {
                const Icon = social.icon

                return (
                  <Button
                    key={social.name}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={social.name}
                    title={social.name}
                    onClick={() => {
                      if (social.href !== "#") {
                        window.open(
                          social.href,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    }}
                    className="h-9 w-9 shrink-0 rounded-lg bg-[#182328] text-gray-200 transition-all duration-200 hover:-translate-y-1 hover:bg-[#B6F70B] hover:text-black"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Separator */}

        <Separator className="bg-[#273136]" />

        {/* Copyright */}

        <div className="flex flex-col items-start justify-between gap-3 py-5 text-[11px] text-gray-400 sm:flex-row sm:items-center">
          <p>© 2026 MentorLagbe. All rights reserved.</p>

          <p>Tuition &amp; Mentorship Platform (MentorLagbe)</p>
        </div>
      </div>
    </footer>
  )
}
