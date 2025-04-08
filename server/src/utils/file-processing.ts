import { createWorker } from "tesseract.js";
import { UploadedFile } from "../types";
import mammoth from "mammoth";
import pdf from "pdf-parse";

export const processImageWithOCR = async (
  file: UploadedFile
): Promise<string> => {
  try {
    const worker: any = await createWorker();

    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const { data } = await worker.recognize(file.buffer);
    await worker.terminate();

    return data.text;
  } catch (error) {
    console.error("Error processing image with OCR:", error);
    throw new Error("Failed to extract text from image");
  }
};

export const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from Word document");
  }
};

export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF document");
  }
};

export const processUploadedFile = async (
  file: UploadedFile
): Promise<string> => {
  try {
    if (file.mimetype.includes("image/")) {
      return processImageWithOCR(file);
    } else if (file.mimetype === "application/pdf") {
      return extractTextFromPDF(file.buffer);
    } else if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      return extractTextFromDocx(file.buffer);
    } else {
      throw new Error("Unsupported file type");
    }
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    throw error;
  }
};
