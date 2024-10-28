import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "../../../lib/db";
import youtubesearchapi from "youtube-search-api";

const YT_REGEX =
  /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/g;

const CreateStramSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStramSchema.parse(await req.json());
    const isYt = data.url.match(YT_REGEX);

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

    const res = await youtubesearchapi.GetVideoDetails(extractedId);
    console.log(res.title);
    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    if (!extractedId) {
      return NextResponse.json(
        { message: "Failed to extract video ID from the URL" },
        { status: 400 }
      );
    }

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId, // Store extracted video ID
        type: "Youtube",
        title: res.title,
      },
    });

    return NextResponse.json(
      { message: "Stream created successfully", id: stream.id },
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

export async function GET(req: NextRequest) {
  const createrId = req.nextUrl.searchParams.get("createrId");
  const streams = await prismaClient.stream.findMany({
    where: {
      userId: createrId ?? "",
    },
  });

  return NextResponse.json({
    streams,
  });
}
