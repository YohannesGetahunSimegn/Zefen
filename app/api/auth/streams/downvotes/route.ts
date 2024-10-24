import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
  streamId: z.string(),
});
