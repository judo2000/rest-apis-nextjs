import connect from "@/lib/db";
import User from "@/lib/models/user";
import Category from "@/lib/models/category";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return (
        new NextResponse(
          JSON.stringify({ message: "Missing or invalid user id" })
        ),
        { status: 400 }
      );
    }

    await connect();
    const user = await User.findById(userId);

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User nout found" }), {
        status: 404,
      });
    }

    const categories = await Category.find({
      user: new Types.ObjectId(userId),
    });

    return new NextResponse(JSON.stringify(categories), { status: 200 });
  } catch (error: any) {
    return new NextResponse("Error fetching categories " + error.message, {
      status: 500,
    });
  }
};

export const POST = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const { title } = await request.json();

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return (
        new NextResponse(
          JSON.stringify({ message: "Missing or invalid user id" })
        ),
        { status: 400 }
      );
    }

    await connect();
    const user = await User.findById(userId);

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User nout found" }), {
        status: 404,
      });
    }

    const newCategory = new Category({
      title,
      user: new Types.ObjectId(userId),
    });

    await newCategory.save();

    return new NextResponse(
      JSON.stringify({
        message: "Category created successfully , category: newCategory",
      }),
      { status: 201 }
    );
  } catch (error: any) {
    return new NextResponse("Error creating category " + error.message, {
      status: 500,
    });
  }
};
