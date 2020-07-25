import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Balance {
  total: number;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (value > total) {
        throw new AppError('Insufficient funds');
      }
    }

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type invalid.');
    }

    let categoryFound = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryFound) {
      categoryFound = await categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryFound);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryFound,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
