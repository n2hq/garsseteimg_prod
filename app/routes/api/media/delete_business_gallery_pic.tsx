import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { unlink } from "fs/promises";
import path from "path";
import { query } from "../DB";
import { DoResponse } from "~/lib/lib";

const galleryDir = path.resolve("vmedia/business_gallery_pics");

export const loader: LoaderFunction = async ({ request, params }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "http://localhost:3393",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true", // optional
            },
        });
    }

    return DoResponse({ error: "method not allowed" }, 405)


}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const contentType = request.headers.get("Content-Type");
        if (!contentType?.includes("application/json")) {
            return DoResponse({ error: "Invalid content type. Expected JSON." }, 415);
        }

        const body = await request.json();
        const { guid: userGuid, bid: businessGuid, image_guid: imageGuid } = body;

        if (!userGuid || !businessGuid || !imageGuid) {
            return DoResponse({ error: "Missing required fields" }, 400);
        }

        const [existingImageRecord] = await query(
            `SELECT * FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
            [userGuid, businessGuid, imageGuid]
        );

        const image = (existingImageRecord as any);
        if (!image) {
            return DoResponse({ message: "Image does not exist" }, 200);
        }

        // Delete image file
        const imagePath = path.join(galleryDir, image.image_filename);
        try {
            await unlink(imagePath);
            console.log(`Deleted old file: ${imagePath}`);
        } catch (err: any) {
            if (err.code !== "ENOENT") {
                console.error("Error deleting file:", err);
                return DoResponse({ error: "File deletion failed" }, 500);
            }
        }

        // Delete DB record
        await query(
            `DELETE FROM tbl_business_gallery_image
       WHERE user_guid = ? AND business_guid = ? AND image_guid = ?`,
            [userGuid, businessGuid, imageGuid]
        );

        return DoResponse(
            {
                message: "File deleted successfully",
                insertId: image.id,
            },
            200
        );
    } catch (error: any) {
        console.error("Deletion error:", error);
        return DoResponse({ error: error.message || "Deletion failed" }, 500);
    }
};