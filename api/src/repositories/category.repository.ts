import { and, asc, count, eq, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { type Category, categories, type NewCategory } from "@/models/schema/categories.js";
import { transactions } from "@/models/schema/transactions.js";

export type CategoryType = "expense" | "income" | "both";

export interface ListCategoriesParams {
  userId: string;
  type?: CategoryType;
  includeInactive: boolean;
}

export class CategoryRepository {
  async findById(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return category;
  }

  async list({ userId, type, includeInactive }: ListCategoriesParams): Promise<Category[]> {
    const conditions = [eq(categories.userId, userId)];

    if (!includeInactive) {
      conditions.push(eq(categories.isActive, true));
    }

    if (type) {
      conditions.push(or(eq(categories.type, type), eq(categories.type, "both")));
    }

    return db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.name));
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(categories)
      .where(eq(categories.userId, userId));

    return result?.total ?? 0;
  }

  async countActiveByUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.isActive, true)));

    return result?.total ?? 0;
  }

  async create(data: NewCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async createMany(data: NewCategory[]): Promise<Category[]> {
    if (data.length === 0) {
      return [];
    }

    return db.insert(categories).values(data).returning();
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewCategory, "id" | "userId">>,
  ): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return category;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });

    return result.length > 0;
  }

  async hasTransactions(categoryId: string): Promise<boolean> {
    const [result] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));

    return (result?.total ?? 0) > 0;
  }

  async countIncompatibleTransactions(categoryId: string, newType: CategoryType): Promise<number> {
    if (newType === "both") {
      return 0;
    }

    const incompatibleType = newType === "expense" ? "income" : "expense";

    const [result] = await db
      .select({ total: count() })
      .from(transactions)
      .where(and(eq(transactions.categoryId, categoryId), eq(transactions.type, incompatibleType)));

    return result?.total ?? 0;
  }
}
