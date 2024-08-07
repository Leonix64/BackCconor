import { Request, Response } from 'express';
import Sale from '../models-mongoose/Sales';
import Item from '../models-mongoose/Item';
import mongoose from 'mongoose';
import Empresa from '../models-mongoose/Company';
import Ingredient from '../models-mongoose/Ingredient';

export const getSalesStatistics = async (req: Request, res: Response) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { $month: "$date" },
          totalSales: { $sum: "$total" },
          totalDiscount: { $sum: "$discount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ ok: true, sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales statistics', error });
  }
};

export const getItemsStatistics = async (req: Request, res: Response) => {
  try {
    const items = await Item.aggregate([
      {
        $group: {
          _id: "$product",
          totalStock: { $sum: "$stock" },
          totalValue: { $sum: { $multiply: ["$stock", "$price"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalStock: -1 } }
    ]);

    res.status(200).json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items statistics', error });
  }
};

export const getIngredientsStatistics = async (req: Request, res: Response) => {
  try {
    const ingredients = await Ingredient.aggregate([
      {
        $group: {
          _id: "$name",
          totalStock: { $sum: "$stock" },
          totalValue: { $sum: { $multiply: ["$stock", "$pricePerUnit"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalStock: -1 } }
    ]);

    res.status(200).json({ ok: true, ingredients });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ingredients statistics', error });
  }
};

export const getTopSellingProductsByWeek = async (req: Request, res: Response) => {
  try {
    const { year, week, companyId } = req.query;

    if (!year || !week || !companyId) {
      return res.status(400).json({ message: 'Year, week, and companyId are required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const sales = await Sale.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          },
          company: new mongoose.Types.ObjectId(companyId as string)
        }
      },
      {
        $addFields: {
          week: { $isoWeek: "$date" }
        }
      },
      {
        $match: {
          week: parseInt(week as string)
        }
      },
      {
        $unwind: "$productsSold"
      },
      {
        $group: {
          _id: { week: "$week", product: "$productsSold.product" },
          totalQuantity: { $sum: "$productsSold.quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $sort: { totalQuantity: -1 }
      }
    ]);

    res.status(200).json({ ok: true, sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top selling products by week', error });
  }
};

export const getIngredientsStatisticsByWeek = async (req: Request, res: Response) => {
  try {
    const { year, week, companyId } = req.query;

    if (!year || !week || !companyId) {
      return res.status(400).json({ message: 'Year, week, and companyId are required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const ingredients = await Ingredient.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          },
          company: new mongoose.Types.ObjectId(companyId as string)
        }
      },
      {
        $addFields: {
          week: { $isoWeek: "$date" }
        }
      },
      {
        $match: {
          week: parseInt(week as string)
        }
      },
      {
        $group: {
          _id: "$name",
          totalStock: { $sum: "$stock" },
          totalValue: { $sum: { $multiply: ["$stock", "$pricePerUnit"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalStock: -1 } }
    ]);

    res.status(200).json({ ok: true, ingredients });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ingredients statistics by week', error });
  }
};
