"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { PlusCircle, Menu, X } from "lucide-react"
import { AdminLink } from '@/components/admin-link'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between p-4 bg-green-300 relative">
      <Link href="/" className="text-xl font-semibold hover:text-green-800">
        positive.help
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        
      <Button size="sm" className="md:hidden bg-white text-green-800 hover:bg-green-50 px-4 leading-none relative">
        <div className="flex items-center">
          <PlusCircle className="w-4 h-4 block" />
          <Link href="/add" className="ml-0 md:ml-2 absolute inset-0 flex items-center">
            <span className="hidden md:inline">Add Positivity</span>
          </Link>
        </div>
      </Button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-1"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-green-800" />
          ) : (
            <Menu className="h-6 w-6 text-green-800" />
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">

        <SignedIn>
          <Button variant="ghost" className="text-green-800 hover:bg-green-50">
            <Link href="/submissions">
              Submissions
            </Link>
          </Button>
        </SignedIn>
        <Button size="sm" className="bg-white text-green-800 hover:bg-green-50 px-4 md:px-6 leading-none">
          <div className="flex items-center"> 
            <PlusCircle className="w-4 h-4 block" />
            <Link href="/add" className="ml-0 md:ml-2">
              <span className="hidden md:inline">Add Positivity</span>
            </Link>
          </div>
        </Button>          
          <SignedIn>
            <AdminLink />
          </SignedIn>
          <SignedOut>
            <div className="flex justify-end">
              <SignInButton mode="modal" />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex justify-end">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 w-30 bg-green-300 p-4 md:hidden flex flex-col gap-2 shadow-lg z-50 rounded-bl-lg">
            <SignedIn>
              <Button variant="ghost" className="text-green-800 hover:bg-green-50 w-full justify-end">
                <Link href="/submissions">
                  Submissions
                </Link>
              </Button>
            </SignedIn>
            <SignedIn>
              <AdminLink />
            </SignedIn>
            <SignedOut>
              <div className="flex justify-end w-full">
                <SignInButton mode="modal" />
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex justify-end w-full">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  );
} 