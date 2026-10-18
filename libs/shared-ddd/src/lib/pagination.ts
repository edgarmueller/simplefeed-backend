import { ObjectLiteral, SelectQueryBuilder } from 'typeorm'

export const DEFAULT_PAGE_SIZE = 10

export interface PageOptions {
  /** 1-based page number */
  page?: number
  limit?: number
}

export interface PageMeta {
  itemCount: number
  totalItems: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

function positiveIntegerOr(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Fetches one page of entities. Uses `take`/`skip` rather than `LIMIT`/`OFFSET`
 * so that joined to-many relations don't eat into the page size.
 */
export async function paginate<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PageOptions = {}
): Promise<Page<T>> {
  const currentPage = positiveIntegerOr(options.page, 1)
  const itemsPerPage = positiveIntegerOr(options.limit, DEFAULT_PAGE_SIZE)
  const [items, totalItems] = await queryBuilder
    .take(itemsPerPage)
    .skip((currentPage - 1) * itemsPerPage)
    .getManyAndCount()
  return {
    items,
    meta: {
      itemCount: items.length,
      totalItems,
      itemsPerPage,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      currentPage,
    },
  }
}

export function mapPage<T, R>(page: Page<T>, mapItem: (item: T) => R): Page<R> {
  return { ...page, items: page.items.map(mapItem) }
}
