import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import React from 'react'

const Campaigns = () => {
	return (
		<div className="h-full flex flex-col space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
					<p className="text-muted-foreground">
						Multi-channel messaging campaigns targeting your user segments
					</p>
				</div>
				<Button
					className=""

				>
					<Plus className="h-4 w-4 mr-2" />
					New Campaign
				</Button>
			</div>
		</div>
	)
}

export default Campaigns