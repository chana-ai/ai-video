'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Clock, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { CreateProjectDialog } from './components/create-project-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import instance from "@/lib/axios";
import config from '@/app/settings/config'
import { useRouter, useSearchParams } from 'next/navigation'


interface Project {
  id: string
  name: string
  stage_id: string
  stage_name: string
  status: 'Processing' | 'Complete' | 'Init'
  update_time: string
  screen_url?: string
}

interface PaginationInfo {
  current: number
  pages: number
  size: number
  total: number
}

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pages: 1,
    size: 10,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    searchProjects(1)
  }, []);

  const searchProjects = (page: number, name?: string) => {
    setIsLoading(true)
    instance.post('/api/v2/project/search', {
      page_size: pagination.size,
      page: page,
      // ...(config.debug ? { user_id: 1 } : {}),
      ...(name ? { name } : {}), 
    }).then((res) => {
      const responseData = res?.data || res || {}
      setProjects(responseData.records || [])
      
      // Update pagination info
      if (responseData.pagination) {
        setPagination({
          current: responseData.pagination.current || page,
          pages: responseData.pagination.pages || 1,
          size: responseData.pagination.size || pagination.size,
          total: responseData.pagination.total || 0
        })
      }
      setIsLoading(false)
    }).catch((error) => {
      console.error('Error fetching projects:', error)
      setIsLoading(false)
    })
  }

  const handleSearch = () => {
    searchProjects(1, searchTerm)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      searchProjects(newPage, searchTerm)
    }
  }

  const handleDelete = (id: string, stage_id: string) => {
    setProjects(projects.filter(project => project.stage_id !== stage_id))
    
     instance.post('/api/v2/project/delete_stage', {
      stage_id: stage_id,
      project_id: id,
      ...(config.debug ? { user_id: 1 } : {}),
    }).then((res)=>{
      console.log(res)
      // Refresh current page after deletion
      searchProjects(pagination.current, searchTerm)
    })
  }

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesStatus
  })

  //const listProjects = filteredProjects.filter(p => p.status === 'all')
  // const otherProjects = filteredProjects.filter(p => p.status !== 'Processing')

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card 
      key={project.id} 
      onClick={() => router.push(`/ai/projects/script-configuration?project_id=${project.id}&stage_id=${project.stage_id}`)}
      className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
    >
      {/* Screen Image - Zoom to fit */}
      {(
        <div className="w-full h-40 bg-gray-100 overflow-hidden">
          <img 
            src={project.screen_url || '/default-project.png'} 
            alt={`${project.name} preview`}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-3">
        {/* First Row - Project Name */}
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-center line-clamp-2 leading-tight">
            {project.name}:{project.stage_name}
          </h2>
        </div>
        
        {/* Second Row - Status, Timestamp, Delete Icon */}
        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              project.status === 'Processing'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {project.status}
          </span>
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>{project.update_time}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(project.id, project.stage_id)
            }}
          >
            <Trash2 className="w-3 h-3" />
            <span className="sr-only">Delete project</span>
          </Button>
        </div>
      </div>
    </Card>
  )

  const PaginationControls = () => {
    const startItem = (pagination.current - 1) * pagination.size + 1
    const endItem = Math.min(pagination.current * pagination.size, pagination.total)
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {pagination.total} projects
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum
              if (pagination.pages <= 5) {
                pageNum = i + 1
              } else if (pagination.current <= 3) {
                pageNum = i + 1
              } else if (pagination.current >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i
              } else {
                pageNum = pagination.current - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pagination.current === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= pagination.pages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Project 列表</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
              disabled={isLoading}
            >
              Search
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Processing">PROCESSING</SelectItem>
                <SelectItem value="Complete">COMPLETE</SelectItem>
                <SelectItem value="Init">INIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            <span className="mr-2">+</span>
            Create New Project
          </Button>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
            <span className="ml-2 text-gray-600">Loading projects...</span>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            {/* Empty state */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No projects found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && pagination.total > 0 && <PaginationControls />}

      <CreateProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}

