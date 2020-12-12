import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameRoutingModule } from './game-routing.module';
import { ChatModule } from '../../chat/chat.module';

import { LobbyComponent } from './lobby/lobby.component';
import { HomeComponent } from './home/home.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';

import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { WdymComponent } from './wdym/wdym.component';


@NgModule({
  declarations: [
    WdymComponent,
    LobbyComponent,
    HomeComponent,
    ChatContainerComponent
  ],
  imports: [
    CommonModule,
    GameRoutingModule,
    ChatModule,
    MatSidenavModule,
    MatToolbarModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    //Imports for drag and drop
    DragDropModule,
    BrowserAnimationsModule,
    BrowserModule

  ],
  providers:[],
  
})
export class GameModule { }
