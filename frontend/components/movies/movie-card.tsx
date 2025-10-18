"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Movie } from "@/lib/types"
import Image from "next/image"

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter()

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
      onClick={() => router.push(`/movie/${movie.id_pelicula}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <Image
          src={movie.imagen_url || `/placeholder.svg?height=600&width=400&query=${encodeURIComponent(movie.titulo)}`}
          alt={movie.titulo}
          fill
          className="object-cover transition-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              {movie.genero}
            </Badge>
            <Badge variant="outline" className="border-white/50 bg-black/50 text-white">
              {movie.clasificacion}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-balance text-lg font-semibold text-foreground line-clamp-2">{movie.titulo}</h3>
        <p className="mt-1 text-pretty text-sm text-muted-foreground line-clamp-2">{movie.sinopsis}</p>
      </CardContent>
    </Card>
  )
}
