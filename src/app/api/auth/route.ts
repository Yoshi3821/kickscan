import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createHash } from "crypto";

interface User {
  id: string;
  username: string;
  email?: string;
  total_points: number;
  total_predictions: number;
  correct_results: number;
  correct_scores: number;
  current_streak: number;
  best_streak: number;
  boosters_used_today: number;
  last_booster_date: string;
  created_at: string;
  last_login: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function isValidUsername(username: string): boolean {
  // Allow letters, numbers, underscores, and spaces. 3-20 chars (after trim).
  const trimmed = username.trim().replace(/\s+/g, ' ');
  return /^[a-zA-Z0-9_ ]{3,20}$/.test(trimmed) && trimmed.length >= 3;
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/\s+/g, ' ');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateRank(user: User, allUsers: User[]): number {
  const sorted = allUsers.sort((a, b) => b.total_points - a.total_points);
  return sorted.findIndex(u => u.id === user.id) + 1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, email, password } = body;

    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    if (action === "register") {
      // Validation
      if (!username || !email || !password) {
        return NextResponse.json({ 
          error: "username, email, and password required" 
        }, { status: 400 });
      }

      const normalizedName = normalizeUsername(username);
      
      if (!isValidUsername(normalizedName)) {
        return NextResponse.json({ 
          error: "Display name must be 3-20 characters. Letters, numbers, spaces, and underscores only." 
        }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      if (!isValidEmail(trimmedEmail)) {
        return NextResponse.json({ 
          error: "Please enter a valid email address (e.g. name@email.com)" 
        }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ 
          error: "Password must be at least 6 characters" 
        }, { status: 400 });
      }

      // Check if username already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', normalizedName.toLowerCase())
        .single();

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      // Check if email already exists
      const { data: existingEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', trimmedEmail)
        .single();

      if (existingEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      // Create new user
      const passwordHash = hashPassword(password);
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: normalizedName.toLowerCase(),
          email: trimmedEmail,
          password_hash: passwordHash,
          total_points: 0,
          total_predictions: 0,
          correct_results: 0,
          correct_scores: 0,
          current_streak: 0,
          best_streak: 0,
          boosters_used_today: 0,
          last_booster_date: today,
          email_verified: false,
          email_opt_in: true,
          created_at: now,
          last_login: now
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: { 
          id: newUser.id, 
          username: newUser.username 
        },
        token: newUser.id
      });

    } else if (action === "login") {
      if (!username || !password) {
        return NextResponse.json({ 
          error: "username and password required" 
        }, { status: 400 });
      }

      // Find user by username
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (error || !user) {
        return NextResponse.json({ error: "Username not found" }, { status: 404 });
      }

      // Verify password
      const passwordHash = hashPassword(password);
      if (user.password_hash !== passwordHash) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }

      // Update last login
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('users')
        .update({ last_login: now })
        .eq('id', user.id);

      // Get all users to calculate rank
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('total_points', { ascending: false });

      const rank = calculateRank(user, allUsers || []);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          totalPoints: user.total_points,
          rank: rank
        },
        token: user.id
      });

    } else if (action === "check_username") {
      if (!username) {
        return NextResponse.json({ error: "username required" }, { status: 400 });
      }

      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', normalizeUsername(username).toLowerCase())
        .single();

      return NextResponse.json({ available: !existingUser });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    // Find user by token (token = user id)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', token)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all users to calculate rank
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('total_points', { ascending: false });

    const rank = calculateRank(user, allUsers || []);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        totalPoints: user.total_points,
        predictions: user.total_predictions,
        correctResults: user.correct_results,
        correctScores: user.correct_scores || 0,
        currentStreak: user.current_streak,
        bestStreak: user.best_streak,
        boostersUsedToday: user.last_booster_date === new Date().toISOString().split('T')[0] ? user.boosters_used_today : 0,
        rank: rank,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error("Validation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}