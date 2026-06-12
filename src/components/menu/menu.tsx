import { Menu } from '@headlessui/react'

function App() {
 return (
   <div className="shadow-md bg-white w-48">
     <Menu>
       <Menu.Button className="px-4 py-2 text-sm font-medium text-gray-700">
         More
       </Menu.Button>
       <Menu.Items className="py-2 text-sm font-medium text-gray-700">
         <Menu.Item>
           {({ active }) => (
             <a
               className={`block px-4 py-2 ${active ? 'bg-blue-500 text-white' : 'text-gray-700'
                 }`}
               href="/account-settings"
             >
               Account settings
             </a>
           )}
         </Menu.Item>
         <Menu.Item>
           {({ active }) => (
             <a
               className={`block px-4 py-2 ${active ? 'bg-blue-500 text-white' : 'text-gray-700'
                 }`}
               href="/account-settings"
             >
               Documentation
             </a>
           )}
         </Menu.Item>
         <Menu.Item disabled>
           <span className="block px-4 py-2 text-gray-400">
             Invite a friend (coming soon!)
           </span>
         </Menu.Item>
       </Menu.Items>
     </Menu>
   </div>
 )
}


export default App