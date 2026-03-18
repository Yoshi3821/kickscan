import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "subscribers.json");

interface Subscriber {
  email: string;
  name?: string;
  dateSubscribed: string;
}

async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await fs.readFile(SUBSCRIBERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSubscribers(subs: Subscriber[]): Promise<void> {
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const subscribers = await getSubscribers();

    // Check for duplicates
    if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "This email is already subscribed" }, { status: 409 });
    }

    subscribers.push({
      email: email.toLowerCase().trim(),
      name: name?.trim() || undefined,
      dateSubscribed: new Date().toISOString(),
    });

    await saveSubscribers(subscribers);

    return NextResponse.json({ success: true, count: subscribers.length });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
