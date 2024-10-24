import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "../../../lib/db";

const YT_REGEX = new RegExp(
  "https://www\\.youtube\\.com/watch\\?v=[a-zA-Z0-9_-]{11}"
);

const CreateStramSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStramSchema.parse(await req.json());
    const isYt = YT_REGEX.test(data.url);

    if (!isYt) {
      return NextResponse.json(
        {
          message: "Wrong url format",
        },
        {
          status: 411,
        }
      );
    }

    const extractedId = data.url.includes("?v=")
      ? data.url.split("?v=")[1]
      : null;

    if (!extractedId) {
      return NextResponse.json(
        { message: "Failed to extract video ID from the URL" },
        { status: 400 }
      );
    }

    await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId, // Store extracted video ID
        type: "Youtube",
      },
    });

    return NextResponse.json(
      { message: "Stream created successfully" },
      { status: 201 } // Use 201 for successful creation
    );
  } catch (err) {
    return NextResponse.json(
      {
        message: `Error while adding a stream: ${err}`,
      },
      {
        status: 411,
      }
    );
  }
}
