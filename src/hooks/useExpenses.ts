import { useState, useEffect, useCallback } from 'react'
import { peopleApi, categoriesApi, transactionsApi } from '../lib/api'
import { Person, Category, Transaction } from '../types'
import { useAuth } from './useAuth'

export function usePeople() {
  const { user } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    try {
      const data = await peopleApi.list()
      setPeople(data)
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (name: string) => {
    await peopleApi.add(name)
    fetch()
  }

  const remove = async (id: string) => {
    await peopleApi.remove(id)
    fetch()
  }

  return { people, loading, add, remove }
}

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    try {
      const data = await categoriesApi.list()
      setCategories(data)
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  return { categories, loading }
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    try {
      const data = await transactionsApi.list()
      setTransactions(data)
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (tx: {
    person_id?: string
    merchant?: string
    date: string
    total_amount: number
    currency?: string
    notes?: string
    items: { category_id: string; description: string; amount: number }[]
  }) => {
    await transactionsApi.add(tx)
    fetch()
  }

  const remove = async (id: string) => {
    await transactionsApi.remove(id)
    fetch()
  }

  return { transactions, loading, add, remove }
}
