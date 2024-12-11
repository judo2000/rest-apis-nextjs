import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Blog from "@/lib/models/blog";
import { Types } from "mongoose";
import User from "@/lib/models/user";
import Category from "@/lib/models/category";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");
    const searchTerms = searchParams.get("keywords") as string;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const direction = searchParams.get("direction") || "asc";

    // if (sortDirection === null) {
    //   sortDirection = "asc";
    // }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing user id" }),
        { status: 400 }
      );
    }

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing category id" }),
        { status: 400 }
      );
    }

    await connect();

    const user = await User.findById(userId);

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return new NextResponse(
        JSON.stringify({
          message: "Category not found",
        }),
        { status: 404 }
      );
    }

    const filter: any = {
      user: new Types.ObjectId(userId),
      category: new Types.ObjectId(categoryId),
    };

    if (searchTerms) {
      filter.$or = [
        {
          title: { $regex: searchTerms, $options: "i" },
        },
        {
          description: { $regex: searchTerms, $options: "i" },
        },
      ];
    }

    if (startDate && endDate) {
      // if start date and end date exist
      // return blogs created between these to dates
      // gte = Greater Than or Equal to
      // lte = Less Than or Equal to
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      // if only the start date specified
      // only the blogs created between the start date and the
      // current date are fetched
      filter.createdAt = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      // if only the end date it will fetch any blogs
      // created before the end date
      filter.createdAt = {
        $lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;
    console.log("page ", page);
    console.log(page - 1 * 10);
    console.log("skip ", skip);
    const blogs = await Blog.find(filter)
      .sort({ createdAt: direction })
      .skip(skip)
      .limit(limit);

    return new NextResponse(JSON.stringify({ blogs }), { status: 200 });
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ message: "Error fetching blogs" + error.message }),
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");

    const body = await request.json();
    const { title, description } = body;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing user id" }),
        { status: 400 }
      );
    }

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing category id" }),
        { status: 400 }
      );
    }

    await connect();

    const user = await User.findById(userId);

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return new NextResponse(
        JSON.stringify({
          message: "Category not found",
        }),
        { status: 404 }
      );
    }

    const newBlog = new Blog({
      title,
      description,
      user: new Types.ObjectId(userId),
      category: new Types.ObjectId(categoryId),
    });

    await newBlog.save();

    return new NextResponse(
      JSON.stringify({ message: "Blog created successfully", blog: newBlog }),
      { status: 201 }
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ message: "Error creating blog" + error.message }),
      { status: 500 }
    );
  }
};
