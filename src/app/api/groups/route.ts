import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generate a unique 6-character group code
function generateGroupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, name, code, competition = 'wc2026' } = body;

    if (action === 'create') {
      if (!userId || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Generate unique code
      let groupCode = generateGroupCode();
      let attempts = 0;
      
      while (attempts < 10) {
        const { data: existingGroup } = await supabase
          .from('groups')
          .select('id')
          .eq('code', groupCode)
          .single();

        if (!existingGroup) break;
        
        groupCode = generateGroupCode();
        attempts++;
      }

      if (attempts >= 10) {
        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          code: groupCode,
          created_by: userId,
          competition
        })
        .select()
        .single();

      if (groupError) {
        return NextResponse.json({ error: groupError.message }, { status: 500 });
      }

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId
        });

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        group: {
          id: group.id,
          name: group.name,
          code: group.code
        }
      });
    }

    if (action === 'join') {
      if (!userId || !code) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (groupError || !group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Check if user already member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
      }

      // Check member limit
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (memberCount && memberCount >= group.max_members) {
        return NextResponse.json({ error: 'Group is full' }, { status: 400 });
      }

      // Add user to group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId
        });

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        group: {
          id: group.id,
          name: group.name,
          memberCount: (memberCount || 0) + 1
        }
      });
    }

    if (action === 'leave') {
      const { groupId } = body;
      if (!userId || !groupId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if user is member
      const { data: member } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 });
      }

      // Remove user from group
      const { error: leaveError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (leaveError) {
        return NextResponse.json({ error: leaveError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Groups API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

    if (userId) {
      // Get user's groups with member count
      const { data: userGroups, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            code,
            competition,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (userGroups || []).map(async (member: any) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', member.groups.id);

          return {
            ...member.groups,
            memberCount: count || 0
          };
        })
      );

      return NextResponse.json({ groups: groupsWithCounts });
    }

    if (groupId) {
      // Get group leaderboard
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Get group members with join timestamp
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          created_at,
          users (
            id,
            username,
            email
          )
        `)
        .eq('group_id', groupId);

      if (membersError) {
        return NextResponse.json({ error: membersError.message }, { status: 500 });
      }

      // Calculate points for each member based on competition
      const matchPrefix = group.competition === 'wc2026' ? 'wc_' : 'league_';
      const isLeague = group.competition === 'league';
      
      const leaderboard = await Promise.all(
        (members || []).map(async (member: any) => {
          // For league groups: only count predictions made after member joined (fairness)
          let query = supabase
            .from('predictions')
            .select('points_earned, created_at')
            .eq('user_id', member.users.id)
            .like('match_id', `${matchPrefix}%`)
            .not('points_earned', 'is', null);

          if (isLeague && member.created_at) {
            query = query.gte('created_at', member.created_at);
          }

          const { data: predictions } = await query;

          const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;

          return {
            userId: member.users.id,
            username: member.users.username,
            email: member.users.email,
            points: totalPoints
          };
        })
      );

      // Sort by points descending
      leaderboard.sort((a, b) => b.points - a.points);

      return NextResponse.json({
        group: {
          id: group.id,
          name: group.name,
          code: group.code,
          competition: group.competition,
          memberCount: leaderboard.length
        },
        leaderboard
      });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

  } catch (error) {
    console.error('Groups GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}