import { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { DoResponse } from "~/lib/lib";
import { query } from "../DB";
import sharp from "sharp";

const businessProductGalleryUploadsDir = path.resolve("vmedia/business_gallery_products");

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
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const guid = formData.get("guid") as string | null;
        const bid = formData.get("bid") as string | null;
        const productTitle = formData.get("product_title") as string | null;
        const productDescription = formData.get("product_description") as string | null;

        const rawAmount = (formData.get("product_amount") as string) || "";
        console.log(rawAmount)
        const cleanedAmount = rawAmount
            .replace(/[^\d.]/g, "") // remove ₦, k, commas, etc
            .trim();

        const productAmount: number = cleanedAmount ? Number(cleanedAmount) : 0;

        const productCurrencyCountryId = (formData.get("product_currency_country_id") as string) || "";

        const productLink = formData.get("product_link") as string | null;

        if (!file || typeof file === "string") {
            return DoResponse({ message: "No file selected" }, 405);
        }

        if (!guid || !bid || !productTitle) {
            return DoResponse({ message: "Missing required fields. Product title is compulsory" }, 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uuidname = crypto.randomUUID();

        let outputBuffer
        let ext = path.extname(file.name).toLowerCase();

        outputBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        ext = ".jpg"


        const uniqueName = `${Date.now()}_${uuidname}${ext}`;

        await fs.mkdir(businessProductGalleryUploadsDir, { recursive: true });

        const filePath = path.join(businessProductGalleryUploadsDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        const imageFileUrl = `/business_gallery_products/${uniqueName}`;
        let mimeType = file.type;
        mimeType = 'image/jpeg'
        const productGuid = crypto.randomUUID();

        const result = await query(
            `INSERT INTO tbl_business_gallery_products
            (product_image_filename,
            user_guid,
            product_guid,
            product_image_url,
            mimetype,
            business_guid,
            product_title,
            product_description,
            product_link,
            product_amount,
            product_currency_country_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uniqueName,
                guid,
                productGuid,
                imageFileUrl,
                mimeType,
                bid,
                productTitle,
                productDescription,
                productLink,
                productAmount,
                productCurrencyCountryId
            ]
        );

        return DoResponse(
            {
                message: "File uploaded and saved to database successfully",
                imageFileUrl,
                insertId: (result as any).insertId,
            },
            200
        );
    } catch (error: any) {
        console.error("Upload error:", error);
        return DoResponse({ message: error.message || "Database save failed" }, 500);
    }
};