'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Clock, Trash2, Search } from 'lucide-react'
import { CreateProjectDialog } from './components/create-project-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import instance from "@/lib/axios";
import config from '@/app/settings/config'


interface Project {
  id: string
  name: string
  stage_id: string
  stage_name: string
  status: 'Processing' | 'Complete' | 'Init'
  update_time: string
}

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    searchProjects(1)
  }, []);

  const searchProjects = (index: number, name?: string)=>{
    instance.post('/api/v2/project/search', {
      page_size: 20,
      page: index,
      ...(config.debug ? { user_id: 1 } : {}),
      ...(name ? { name } : {}), 
    }).then((res)=>{
      setProjects(res)
    })
  }
  const handleDelete = (id: string, stage_id: string) => {
    setProjects(projects.filter(project => project.stage_id !== stage_id))
    
     instance.post('/api/v2/project/delete_stage', {
      stage_id: stage_id,
      project_id: id,
      ...(config.debug ? { user_id: 1 } : {}),
    }).then((res)=>{
      console.log(res)
    })
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  //const listProjects = filteredProjects.filter(p => p.status === 'all')
  // const otherProjects = filteredProjects.filter(p => p.status !== 'Processing')

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card 
      key={project.id} 
      className="p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between h-full"
    >
      <div className="flex-grow">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-center h-12 sm:h-14 flex items-center justify-center">
          {project.name}:{project.stage_name}
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 sm:mt-4 space-y-2 sm:space-y-0">
        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
            project.status === 'Processing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {project.status}
        </span>
        <div className="flex items-center text-gray-500">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">{project.update_time}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
          onClick={() => handleDelete(project.id, project.stage_id)}
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="sr-only">Delete project</span>
        </Button>
      </div>
    </Card>
  )

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Project Stage 列表</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
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
        {/* Processing Projects Section */}
        {/* <div>
          <h2 className="text-xl font-semibold mb-3 sm:mb-4">Processing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {processingProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div> */}

        {/* Other Projects Section */}
        <div>
          {/* <h2 className="text-xl font-semibold mb-3 sm:mb-4">Completed</h2> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>

      <CreateProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}

