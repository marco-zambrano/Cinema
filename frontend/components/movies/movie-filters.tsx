"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface MovieFiltersProps {
  onFilter: (filters: { search: string; genre: string; classification: string }) => void
}

export function MovieFilters({ onFilter }: MovieFiltersProps) {
  const [search, setSearch] = useState("")
  const [genre, setGenre] = useState("all")
  const [classification, setClassification] = useState("all")

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilter({ search: value, genre, classification })
  }

  const handleGenreChange = (value: string) => {
    setGenre(value)
    onFilter({ search, genre: value, classification })
  }

  const handleClassificationChange = (value: string) => {
    setClassification(value)
    onFilter({ search, genre, classification: value })
  }

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar películas..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={genre} onValueChange={handleGenreChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Género" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los géneros</SelectItem>
          <SelectItem value="acción">Acción</SelectItem>
          <SelectItem value="comedia">Comedia</SelectItem>
          <SelectItem value="drama">Drama</SelectItem>
          <SelectItem value="terror">Terror</SelectItem>
          <SelectItem value="ciencia ficción">Ciencia Ficción</SelectItem>
          <SelectItem value="romance">Romance</SelectItem>
          <SelectItem value="animación">Animación</SelectItem>
        </SelectContent>
      </Select>

      <Select value={classification} onValueChange={handleClassificationChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Clasificación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="G">G - Público General</SelectItem>
          <SelectItem value="PG">PG - Guía Parental</SelectItem>
          <SelectItem value="PG-13">PG-13 - Mayores de 13</SelectItem>
          <SelectItem value="R">R - Restringida</SelectItem>
          <SelectItem value="NC-17">NC-17 - Adultos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
